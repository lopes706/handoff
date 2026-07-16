;; Handoff: immutable buyer-controlled in-person escrow for sBTC.

(define-constant SBTC 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token)
(define-constant MAX-AMOUNT u50000)
(define-constant MIN-DURATION u300)
(define-constant MAX-DURATION u2592000)
(define-constant MIN-FUNDING-WINDOW u300)

(define-constant STATUS-OPEN u0)
(define-constant STATUS-FUNDED u1)
(define-constant STATUS-COMPLETED u2)
(define-constant STATUS-REFUNDED u3)
(define-constant STATUS-CANCELLED u4)

(define-constant RESOLUTION-NONE u0)
(define-constant RESOLUTION-BUYER-CONFIRMED u1)
(define-constant RESOLUTION-SELLER-CLAIMED u2)
(define-constant RESOLUTION-SELLER-REFUNDED u3)
(define-constant RESOLUTION-EXPIRED-REFUND u4)

(define-constant ERR-INVALID-REF (err u400))
(define-constant ERR-DUPLICATE-REF (err u401))
(define-constant ERR-INVALID-TERMS (err u402))
(define-constant ERR-INVALID-AMOUNT (err u403))
(define-constant ERR-INVALID-EXPIRY (err u404))
(define-constant ERR-INVALID-BUYER (err u405))
(define-constant ERR-NOT-FOUND (err u406))
(define-constant ERR-INVALID-STATUS (err u407))
(define-constant ERR-UNAUTHORIZED (err u408))
(define-constant ERR-FUNDING-CLOSED (err u409))
(define-constant ERR-INVALID-COMMITMENT (err u410))
(define-constant ERR-INVALID-SECRET (err u411))
(define-constant ERR-DEAL-EXPIRED (err u412))
(define-constant ERR-NOT-EXPIRED (err u413))
(define-constant ERR-INDEX (err u414))
(define-constant ERR-TRANSFER (err u415))

(define-data-var total-deals uint u0)
(define-data-var total-liability uint u0)

(define-map deals uint {
  deal-ref: (buff 32),
  seller: principal,
  intended-buyer: (optional principal),
  buyer: (optional principal),
  terms-hash: (buff 32),
  release-commitment: (buff 32),
  amount: uint,
  created-at: uint,
  expires-at: uint,
  funded-at: uint,
  resolved-at: uint,
  status: uint,
  resolution: uint
})
(define-map deal-ref-ids (buff 32) uint)
(define-map actor-activity principal {
  deals-created: uint,
  deals-funded: uint,
  completed-as-seller: uint,
  completed-as-buyer: uint,
  refunded-as-buyer: uint,
  refunds-issued-as-seller: uint
})
(define-map created-counts principal uint)
(define-map funded-counts principal uint)
(define-map created-ids { actor: principal, index: uint } uint)
(define-map funded-ids { actor: principal, index: uint } uint)

(define-private (empty-activity)
  {
    deals-created: u0,
    deals-funded: u0,
    completed-as-seller: u0,
    completed-as-buyer: u0,
    refunded-as-buyer: u0,
    refunds-issued-as-seller: u0
  }
)

(define-private (activity-for (actor principal))
  (default-to (empty-activity) (map-get? actor-activity actor))
)

(define-private (send-sbtc (amount uint) (recipient principal))
  (as-contract?
    ((with-ft SBTC "sbtc-token" amount))
    (unwrap! (contract-call? SBTC transfer amount current-contract recipient none) ERR-TRANSFER)
  )
)

(define-public (create-deal
    (deal-ref (buff 32))
    (terms-hash (buff 32))
    (amount uint)
    (expires-at uint)
    (intended-buyer (optional principal)))
  (let ((now stacks-block-time) (deal-id (+ (var-get total-deals) u1)) (created-count (default-to u0 (map-get? created-counts tx-sender))))
    (asserts! (not (is-eq deal-ref 0x0000000000000000000000000000000000000000000000000000000000000000)) ERR-INVALID-REF)
    (asserts! (is-none (map-get? deal-ref-ids deal-ref)) ERR-DUPLICATE-REF)
    (asserts! (not (is-eq terms-hash 0x0000000000000000000000000000000000000000000000000000000000000000)) ERR-INVALID-TERMS)
    (asserts! (and (> amount u0) (<= amount MAX-AMOUNT)) ERR-INVALID-AMOUNT)
    (asserts! (and (>= expires-at (+ now MIN-DURATION)) (<= expires-at (+ now MAX-DURATION))) ERR-INVALID-EXPIRY)
    (asserts! (not (is-eq intended-buyer (some tx-sender))) ERR-INVALID-BUYER)
    (var-set total-deals deal-id)
    (map-set deals deal-id {
      deal-ref: deal-ref,
      seller: tx-sender,
      intended-buyer: intended-buyer,
      buyer: none,
      terms-hash: terms-hash,
      release-commitment: 0x0000000000000000000000000000000000000000000000000000000000000000,
      amount: amount,
      created-at: now,
      expires-at: expires-at,
      funded-at: u0,
      resolved-at: u0,
      status: STATUS-OPEN,
      resolution: RESOLUTION-NONE
    })
    (map-set deal-ref-ids deal-ref deal-id)
    (map-set created-ids { actor: tx-sender, index: created-count } deal-id)
    (map-set created-counts tx-sender (+ created-count u1))
    (map-set actor-activity tx-sender (merge (activity-for tx-sender) { deals-created: (+ (get deals-created (activity-for tx-sender)) u1) }))
    (print { event: "deal-created", deal-id: deal-id, deal-ref: deal-ref, seller: tx-sender, intended-buyer: intended-buyer, amount: amount, expires-at: expires-at, terms-hash: terms-hash })
    (ok deal-id)
  )
)

(define-public (fund-deal (deal-id uint) (release-commitment (buff 32)))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)) (now stacks-block-time) (funded-count (default-to u0 (map-get? funded-counts tx-sender))))
    (asserts! (is-eq (get status deal) STATUS-OPEN) ERR-INVALID-STATUS)
    (asserts! (not (is-eq tx-sender (get seller deal))) ERR-INVALID-BUYER)
    (asserts! (or (is-none (get intended-buyer deal)) (is-eq (get intended-buyer deal) (some tx-sender))) ERR-UNAUTHORIZED)
    (asserts! (<= (+ now MIN-FUNDING-WINDOW) (get expires-at deal)) ERR-FUNDING-CLOSED)
    (asserts! (not (is-eq release-commitment 0x0000000000000000000000000000000000000000000000000000000000000000)) ERR-INVALID-COMMITMENT)
    (map-set deals deal-id (merge deal { buyer: (some tx-sender), release-commitment: release-commitment, funded-at: now, status: STATUS-FUNDED }))
    (var-set total-liability (+ (var-get total-liability) (get amount deal)))
    (map-set funded-ids { actor: tx-sender, index: funded-count } deal-id)
    (map-set funded-counts tx-sender (+ funded-count u1))
    (map-set actor-activity tx-sender (merge (activity-for tx-sender) { deals-funded: (+ (get deals-funded (activity-for tx-sender)) u1) }))
    (try! (contract-call? SBTC transfer (get amount deal) tx-sender current-contract none))
    (print { event: "deal-funded", deal-id: deal-id, buyer: tx-sender, release-commitment: release-commitment, funded-at: now })
    (ok true)
  )
)

(define-public (confirm-handoff (deal-id uint))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)) (now stacks-block-time) (seller (get seller deal)) (buyer (unwrap! (get buyer deal) ERR-INVALID-STATUS)))
    (asserts! (is-eq (get status deal) STATUS-FUNDED) ERR-INVALID-STATUS)
    (asserts! (is-eq tx-sender buyer) ERR-UNAUTHORIZED)
    (asserts! (< now (get expires-at deal)) ERR-DEAL-EXPIRED)
    (map-set deals deal-id (merge deal { status: STATUS-COMPLETED, resolution: RESOLUTION-BUYER-CONFIRMED, resolved-at: now }))
    (var-set total-liability (- (var-get total-liability) (get amount deal)))
    (map-set actor-activity seller (merge (activity-for seller) { completed-as-seller: (+ (get completed-as-seller (activity-for seller)) u1) }))
    (map-set actor-activity buyer (merge (activity-for buyer) { completed-as-buyer: (+ (get completed-as-buyer (activity-for buyer)) u1) }))
    (try! (send-sbtc (get amount deal) seller))
    (print { event: "deal-completed", deal-id: deal-id, seller: seller, buyer: buyer, resolution: RESOLUTION-BUYER-CONFIRMED, resolved-at: now })
    (ok true)
  )
)

(define-public (claim-handoff (deal-id uint) (release-secret (buff 32)))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)) (now stacks-block-time) (seller (get seller deal)) (buyer (unwrap! (get buyer deal) ERR-INVALID-STATUS)))
    (asserts! (is-eq (get status deal) STATUS-FUNDED) ERR-INVALID-STATUS)
    (asserts! (is-eq tx-sender seller) ERR-UNAUTHORIZED)
    (asserts! (< now (get expires-at deal)) ERR-DEAL-EXPIRED)
    (asserts! (is-eq (sha256 release-secret) (get release-commitment deal)) ERR-INVALID-SECRET)
    (map-set deals deal-id (merge deal { status: STATUS-COMPLETED, resolution: RESOLUTION-SELLER-CLAIMED, resolved-at: now }))
    (var-set total-liability (- (var-get total-liability) (get amount deal)))
    (map-set actor-activity seller (merge (activity-for seller) { completed-as-seller: (+ (get completed-as-seller (activity-for seller)) u1) }))
    (map-set actor-activity buyer (merge (activity-for buyer) { completed-as-buyer: (+ (get completed-as-buyer (activity-for buyer)) u1) }))
    (try! (send-sbtc (get amount deal) seller))
    (print { event: "deal-completed", deal-id: deal-id, seller: seller, buyer: buyer, resolution: RESOLUTION-SELLER-CLAIMED, resolved-at: now })
    (ok true)
  )
)

(define-private (refund-internal (deal-id uint) (deal { deal-ref: (buff 32), seller: principal, intended-buyer: (optional principal), buyer: (optional principal), terms-hash: (buff 32), release-commitment: (buff 32), amount: uint, created-at: uint, expires-at: uint, funded-at: uint, resolved-at: uint, status: uint, resolution: uint }) (resolution uint))
  (let ((now stacks-block-time) (seller (get seller deal)) (buyer (unwrap-panic (get buyer deal))))
    (map-set deals deal-id (merge deal { status: STATUS-REFUNDED, resolution: resolution, resolved-at: now }))
    (var-set total-liability (- (var-get total-liability) (get amount deal)))
    (map-set actor-activity buyer (merge (activity-for buyer) { refunded-as-buyer: (+ (get refunded-as-buyer (activity-for buyer)) u1) }))
    (map-set actor-activity seller (merge (activity-for seller) { refunds-issued-as-seller: (+ (get refunds-issued-as-seller (activity-for seller)) u1) }))
    (try! (send-sbtc (get amount deal) buyer))
    (print { event: "deal-refunded", deal-id: deal-id, buyer: buyer, resolution: resolution, resolved-at: now })
    (ok true)
  )
)

(define-public (refund-deal (deal-id uint))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (get status deal) STATUS-FUNDED) ERR-INVALID-STATUS)
    (asserts! (is-eq tx-sender (get seller deal)) ERR-UNAUTHORIZED)
    (refund-internal deal-id deal RESOLUTION-SELLER-REFUNDED)
  )
)

(define-public (refund-expired (deal-id uint))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)))
    (asserts! (is-eq (get status deal) STATUS-FUNDED) ERR-INVALID-STATUS)
    (asserts! (>= stacks-block-time (get expires-at deal)) ERR-NOT-EXPIRED)
    (refund-internal deal-id deal RESOLUTION-EXPIRED-REFUND)
  )
)

(define-public (cancel-deal (deal-id uint))
  (let ((deal (unwrap! (map-get? deals deal-id) ERR-NOT-FOUND)) (now stacks-block-time))
    (asserts! (is-eq (get status deal) STATUS-OPEN) ERR-INVALID-STATUS)
    (asserts! (is-eq tx-sender (get seller deal)) ERR-UNAUTHORIZED)
    (map-set deals deal-id (merge deal { status: STATUS-CANCELLED, resolved-at: now }))
    (print { event: "deal-cancelled", deal-id: deal-id, seller: tx-sender, resolved-at: now })
    (ok true)
  )
)

(define-read-only (get-total-deals) (ok (var-get total-deals)))
(define-read-only (get-total-liability) (ok (var-get total-liability)))
(define-read-only (get-chain-time) (ok stacks-block-time))
(define-read-only (get-deal (deal-id uint)) (match (map-get? deals deal-id) deal (ok deal) ERR-NOT-FOUND))
(define-read-only (get-deal-id-by-ref (deal-ref (buff 32))) (ok (default-to u0 (map-get? deal-ref-ids deal-ref))))
(define-read-only (get-actor-activity (actor principal)) (ok (activity-for actor)))
(define-read-only (get-created-count (actor principal)) (ok (default-to u0 (map-get? created-counts actor))))
(define-read-only (get-funded-count (actor principal)) (ok (default-to u0 (map-get? funded-counts actor))))
(define-read-only (get-created-id (actor principal) (index uint)) (match (map-get? created-ids { actor: actor, index: index }) id (ok id) ERR-INDEX))
(define-read-only (get-funded-id (actor principal) (index uint)) (match (map-get? funded-ids { actor: actor, index: index }) id (ok id) ERR-INDEX))
