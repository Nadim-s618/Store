import Link from 'next/link'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  slug: string
  name: string
  price: number
  imageUrl?: string
  stock?: number
}

export default function ProductCard({ slug, name, price, imageUrl, stock }: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className={styles.link}>
      <div className={styles.imageBox}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className={styles.image} />
        )}
      </div>
      <div className={styles.details}>
        <div>
          <h3 className={styles.name}>{name}</h3>
          <p className={styles.price}>${price.toFixed(2)}</p>
        </div>
        {typeof stock === 'number' && <p className={`${styles.availability} ${stock === 0 ? styles.outOfStock : ''}`}>{stock === 0 ? 'Out of stock' : `${stock} ${stock === 1 ? 'item' : 'items'} left`}</p>}
      </div>
    </Link>
  )
}
