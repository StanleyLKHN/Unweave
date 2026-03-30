'use client'

import type { Product, ProductStatus } from '../lib/types'

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft:         'Coming Soon',
  preorder:      'Pre-order Open',
  in_production: 'In Production',
  delivered:     'Delivered',
}

const STATUS_COLOR: Record<ProductStatus, string> = {
  draft:         '#8C7B6E',
  preorder:      '#7A5C45',
  in_production: '#3B6D11',
  delivered:     '#085041',
}

const STATUS_BG: Record<ProductStatus, string> = {
  draft:         '#F5F0E8',
  preorder:      '#F5F0E8',
  in_production: '#EAF3DE',
  delivered:     '#E1F5EE',
}

type Props = {
  product: Product
  onPreorder?: () => void
  size?: 'sm' | 'lg'
}

export default function PreorderBar({ product, onPreorder, size = 'lg' }: Props) {
  const { status, preorder_count, preorder_target } = product
  const pct     = Math.min(Math.round((preorder_count / preorder_target) * 100), 100)
  const spotsLeft = preorder_target - preorder_count
  const isLg    = size === 'lg'

  return (
    <div style={{ width: '100%' }}>

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isLg ? '14px' : '8px' }}>
        <span style={{
          display: 'inline-block',
          background: STATUS_BG[status],
          color: STATUS_COLOR[status],
          fontSize: '9px',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          padding: '4px 12px',
          fontFamily: 'var(--font-sans)',
          fontWeight: 400,
        }}>
          {STATUS_LABEL[status]}
        </span>

        {status === 'preorder' && (
          <span style={{ fontSize: isLg ? '12px' : '10px', color: '#8C7B6E', fontWeight: 300 }}>
            {spotsLeft > 0
              ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} to launch`
              : 'Launching now'}
          </span>
        )}

        {status === 'in_production' && (
          <span style={{ fontSize: isLg ? '12px' : '10px', color: '#3B6D11', fontWeight: 300 }}>
            ✓ Fully funded
          </span>
        )}
      </div>

      {/* Progress bar */}
      {(status === 'preorder' || status === 'in_production') && (
        <div style={{ marginBottom: isLg ? '16px' : '10px' }}>
          <div style={{
            height: isLg ? '4px' : '3px',
            background: '#E8E0D0',
            width: '100%',
            borderRadius: '2px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: status === 'in_production' ? '#3B6D11' : '#7A5C45',
              borderRadius: '2px',
              transition: 'width 0.6s ease',
            }} />
          </div>

          {/* Count labels */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '6px',
          }}>
            <span style={{ fontSize: '11px', color: '#4A3728', fontWeight: 400 }}>
              {preorder_count} ordered
            </span>
            <span style={{ fontSize: '11px', color: '#8C7B6E', fontWeight: 300 }}>
              {preorder_target} needed to produce
            </span>
          </div>
        </div>
      )}

      {/* CTA */}
      {isLg && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {status === 'preorder' && (
            <>
              <button
                onClick={onPreorder}
                style={{
                  background: '#2C1F14',
                  color: '#F5F0E8',
                  border: 'none',
                  padding: '15px 36px',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#4A3728')}
                onMouseLeave={e => (e.currentTarget.style.background = '#2C1F14')}
              >
                Reserve My Piece — ${product.price.toLocaleString()}
              </button>
              <p style={{
                fontSize: '11px',
                color: '#8C7B6E',
                textAlign: 'center',
                lineHeight: 1.6,
                fontWeight: 300,
              }}>
                No charge until {preorder_target} orders are placed.
                <br />Production begins only when the run is fully reserved.
              </p>
            </>
          )}

          {status === 'in_production' && (
            <div style={{
              background: '#EAF3DE',
              padding: '16px 20px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '13px', color: '#27500A', fontWeight: 400, marginBottom: '4px' }}>
                This piece is now in production
              </p>
              <p style={{ fontSize: '11px', color: '#3B6D11', fontWeight: 300 }}>
                Join the waitlist for the next run
              </p>
            </div>
          )}

          {status === 'draft' && (
            <div style={{
              background: '#F5F0E8',
              padding: '16px 20px',
              textAlign: 'center',
              border: '0.5px solid #D4C9B0',
            }}>
              <p style={{ fontSize: '13px', color: '#4A3728', fontWeight: 400 }}>
                Coming soon — notify me
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}