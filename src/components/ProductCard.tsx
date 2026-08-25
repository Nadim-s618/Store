import Link from 'next/link'
import styles from './ProductCard.module.css'

type ProductCardProps = {
  slug: string
  name: string
  price: number
  imageUrl?: string
}

export default function ProductCard({ slug, name, price, imageUrl }: ProductCardProps) {
  return (
    <Link href={`/product/${slug}`} className={styles.link}>
      <div className={styles.imageBox}>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={name} className={styles.image} />
        )}
      </div>
      <h3 className={styles.name}>{name}</h3>
      <p className={styles.price}>${price.toFixed(2)}</p>
    </Link>
  )
}
