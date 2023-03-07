import { getTopicData, isSupportedTopic, Topic } from '@/constants/topics'
import ChatPage from '@/modules/_chats/ChatPage'
import { getCommentIdsQueryKey } from '@/services/subsocial/commentIds'
import { getPostQuery } from '@/services/subsocial/posts'
import { getSubsocialApi } from '@/subsocial-query/subsocial'
import { getCommonServerSideProps } from '@/utils/page'
import { dehydrate, QueryClient } from '@tanstack/react-query'

export const getServerSideProps = getCommonServerSideProps<{
  dehydratedState: any
  topic: Topic
}>({}, async (context) => {
  const { query } = context
  const subsocialApi = await getSubsocialApi()

  const topic = query.topic as string
  const isSupported = isSupportedTopic(topic)
  if (!isSupported) return undefined

  const topicData = getTopicData(topic)
  const { postId } = topicData

  const commentIds = await subsocialApi.blockchain.getReplyIdsByPostId(postId)

  const preloadedPostCount = 15
  const startSlice = Math.max(0, commentIds.length - preloadedPostCount)
  const endSlice = commentIds.length
  const prefetchedCommentIds = commentIds.slice(startSlice, endSlice)
  const posts = await subsocialApi.findPublicPosts(prefetchedCommentIds)

  const queryClient = new QueryClient()
  queryClient.setQueryData(getCommentIdsQueryKey(postId), commentIds)
  posts.forEach((post) => {
    queryClient.setQueryData(getPostQuery.getQueryKey(post.id), post)
  })

  return {
    dehydratedState: dehydrate(queryClient),
    topic: topicData,
  }
})

export default ChatPage
