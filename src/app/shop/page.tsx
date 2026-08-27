import Link from 'next/link'

import ProductCard from '@/components/ProductCard'
import { getProducts, getShopCategories } from '@/services/product.service'
import styles from './shop.module.css'

const cardClasses = [styles.featured, styles.tall, styles.mediumLeft, styles.mediumCenter, styles.small, styles.bottom]
const additionalCardClasses = [styles.additionalWide, styles.additionalWide, styles.additionalLeft, styles.additionalRight]

type ShopPageProps = { searchParams?: Promise<{ search?: string | string[]; category?: string | string[]; sort?: string | string[]; color?: string | string[]; size?: string | string[]; minPrice?: string | string[]; maxPrice?: string | string[] }> }

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = searchParams ? await searchParams : {}
  const selectedCategory = typeof params.category === 'string' ? params.category : ''
  const searchQuery = typeof params.search === 'string' ? params.search.trim() : ''
  const sortByRecent = params.sort === 'new'
  const selectedColor = typeof params.color === 'string' ? params.color : ''
  const selectedSize = typeof params.size === 'string' ? params.size : ''
  const selectedMinPrice = typeof params.minPrice === 'string' ? params.minPrice : ''
  const selectedMaxPrice = typeof params.maxPrice === 'string' ? params.maxPrice : ''
  const [products, categories] = await Promise.all([getProducts({ includeCategory: true }), getShopCategories()])
  const primaryCategories = categories.slice(0, 6)
  const additionalCategories = categories.slice(6, 11)
  const overflowCategories = categories.slice(11)
  const colors = [...new Set(products.flatMap((product) => product.sizeStocks.map((stock) => stock.color)))].sort()
  const sizes = ['S', 'M', 'L', 'XL', 'XXL']
  const minPrice = selectedMinPrice ? Number(selectedMinPrice) : 0
  const maxPrice = selectedMaxPrice ? Number(selectedMaxPrice) : Number.POSITIVE_INFINITY
  const hasFilters = Boolean(searchQuery || selectedCategory || selectedColor || selectedSize || selectedMinPrice || selectedMaxPrice)
  const visibleProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query || [product.name, product.description, product.category?.name].some((value) => value?.toLowerCase().includes(query))
    const hasCategory = !selectedCategory || product.category?.slug === selectedCategory
    const hasColor = !selectedColor || product.sizeStocks.some((stock) => stock.color === selectedColor && stock.quantity > 0)
    const hasSize = !selectedSize || product.sizeStocks.some((stock) => stock.size === selectedSize && stock.quantity > 0)
    const price = Number(product.price)
    return matchesSearch && hasCategory && hasColor && hasSize && price >= minPrice && price <= maxPrice
  }).sort((first, second) => sortByRecent ? second.createdAt.getTime() - first.createdAt.getTime() : 0)

  const renderCategoryCard = (category: typeof categories[number], className: string) => <Link key={category.slug} href={`/shop/category/${category.slug}`} className={`${styles.categoryCard} ${className}`} style={{ backgroundImage: `linear-gradient(180deg, rgba(10, 14, 12, .05), rgba(10, 14, 12, .8)), url("${category.imageUrl}")` }}>
    <div className={styles.cardCopy}>
      <p className={styles.cardEyebrow}>Explore / {category.slug}</p>
      <h2>{category.name}</h2>
      <p>{category.description}</p>
      <span className={styles.explore}>Explore now</span>
    </div>
  </Link>

  return (
    <main className={`${styles.page} ${sortByRecent ? styles.newArrivalsPage : ''}`}>
      <header className={styles.heading}>
        <p className={styles.kicker}>{sortByRecent ? 'Just landed' : 'The collection'}</p>
        <h1>{sortByRecent ? 'New arrivals.' : 'Shop all.'}</h1>
        <p>{sortByRecent ? 'The latest considered pieces, listed from newest to earliest.' : 'Considered pieces for a wardrobe that keeps its place.'}</p>
      </header>

      {!sortByRecent && <details className={styles.filterPanel}>
        <summary><span className={styles.filterIcon} aria-hidden="true">☷</span> Filter</summary>
        <form className={styles.filterBar} method="get" action="/shop">
          <input type="hidden" name="search" value={searchQuery} />
          <label>Category<select name="category" defaultValue={selectedCategory}><option value="">All categories</option>{categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}</select></label>
          <label>Color<select name="color" defaultValue={selectedColor}><option value="">All colors</option>{colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></label>
          <label>Size<select name="size" defaultValue={selectedSize}><option value="">All sizes</option>{sizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
          <label>Min price<input name="minPrice" type="number" min="0" step="0.01" placeholder="$0" defaultValue={selectedMinPrice} /></label>
          <label>Max price<input name="maxPrice" type="number" min="0" step="0.01" placeholder="No limit" defaultValue={selectedMaxPrice} /></label>
          <button type="submit" className={styles.filterButton}>Apply filters</button>
        </form>
      </details>}

      {!sortByRecent && !hasFilters && <section className={styles.categoryShell} aria-label="Shop by category">
        <div className={styles.categoryGrid}>
          {primaryCategories.map((category, index) => renderCategoryCard(category, cardClasses[index]))}
        </div>
        {additionalCategories.length > 0 && <div className={styles.additionalSection}>
          {renderCategoryCard(additionalCategories[0], styles.additionalHeader)}
          <div className={styles.additionalCategoryGrid}>
            {additionalCategories.slice(1).map((category, index) => renderCategoryCard(category, additionalCardClasses[index]))}
          </div>
        </div>}
        {overflowCategories.length > 0 && <div className={styles.overflowSection}>
          <div className={styles.additionalHeader}><p className={styles.cardEyebrow}>New additions</p><h2>More categories.</h2></div>
          <div className={styles.overflowCategoryGrid}>
            {overflowCategories.map((category, index) => renderCategoryCard(category, index % 3 === 2 ? styles.overflowFull : styles.overflowHalf))}
          </div>
        </div>}
      </section>}

      <section id="category-products" className={`${styles.productSection} ${sortByRecent || hasFilters ? styles.focusedProductSection : ''}`}>
        <div className={styles.productHeader}>
          <div>{!sortByRecent && <p className={styles.kicker}>{searchQuery ? `Search / ${searchQuery}` : selectedCategory ? `Category / ${selectedCategory}` : 'All pieces'}</p>}<h2>{searchQuery ? 'Search results.' : selectedCategory ? 'A closer look.' : sortByRecent ? 'New arrivals.' : 'The full edit.'}</h2></div>
          {(selectedCategory || searchQuery || sortByRecent || selectedColor || selectedSize || selectedMinPrice || selectedMaxPrice) && <Link href="/shop" className={styles.clearFilter}>Clear filters</Link>}
        </div>
        {visibleProducts.length === 0 ? <div className={styles.emptyState}>
          <p className={styles.kicker}>A quiet shelf</p>
          <h3>No products available.</h3>
          <p>We couldn’t find a match here. Please try something different.</p>
          {hasFilters && <Link href="/shop" className={styles.clearFilter}>Clear filters</Link>}
        </div> : <div className={styles.productGrid}>{visibleProducts.map((product) => <ProductCard key={product.id} slug={product.slug} name={product.name} price={Number(product.price)} imageUrl={product.imageUrl ?? undefined} stock={product.stock} />)}</div>}
      </section>
    </main>
  )
}
