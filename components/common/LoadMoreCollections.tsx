import { Box } from 'components/primitives'
import { FC, useEffect } from 'react'
import { useIntersectionObserver } from 'usehooks-ts'

const LoadMoreCollections: FC<{ loadMore: () => void }> = ({ loadMore }) => {
  const [loadMoreRef, loadMoreEntry] = useIntersectionObserver({ threshold: 0 })

  useEffect(() => {
    const isVisible = !!loadMoreEntry
    if (isVisible) loadMore()
  }, [loadMoreEntry, loadMore])
  return <Box ref={loadMoreRef} css={{ height: 20, width: '100%' }} />
}

export default LoadMoreCollections
