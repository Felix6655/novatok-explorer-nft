import { NextPage } from 'next'
import { Text, Flex, Box } from 'components/primitives'
import Layout from 'components/Layout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderOpen } from '@fortawesome/free-solid-svg-icons'
import Link from 'next/link'

const IndexPage: NextPage = () => {
  return (
    <Layout>
      <Flex
        direction="column"
        align="center"
        css={{ py: '200px', px: '$3', textAlign: 'center' }}
      >
        <Box css={{ color: '$gray11', mb: '30px' }}>
          <FontAwesomeIcon icon={faFolderOpen} size="2xl" />
        </Box>
        <Text style="body1" color="subtle" css={{ mb: '$1' }}>
          404 Error.
        </Text>
        <Text style="body1" color="subtle">
          The requested URL was not found on the server.
        </Text>
        <Box css={{ mt: '$4' }}>
          <Link href="/chain/ethereum">Go to Ethereum Marketplace &rarr;</Link>
        </Box>
      </Flex>
    </Layout>
  )
}

export default IndexPage
