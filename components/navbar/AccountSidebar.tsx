import { FC, useEffect, useState } from 'react'
import { AnimatedOverlay, Content } from 'components/primitives/Dialog'
import { useAccount, useDisconnect } from 'wagmi'
import { useENSResolver } from 'hooks'
import { Box, Button, Flex, Grid, Text } from 'components/primitives'
import * as Avatar from "@radix-ui/react-avatar";
import Jazzicon, { jsNumberForAddress } from "react-jazzicon";
import ThemeSwitcher from './ThemeSwitcher'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChartLine,
  faClose,
  faCopy,
  faHand,
  faList,
  faRightFromBracket,
  faStore,
} from '@fortawesome/free-solid-svg-icons'
import CopyText from 'components/common/CopyText'
import Link from 'next/link'
import Wallet from './Wallet'
import { useRouter } from 'next/router'


const AccountSidebar: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { avatar: ensAvatar, name: ensName } = useENSResolver(address);
  const router = useRouter();
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const shortEnsName = ensName && ensName.length > 18 ? ensName.slice(0, 15) + '...' : ensName;

  if (!isConnected || !address) return null;

  return (
    <Box
      css={{
        minWidth: 260,
        maxWidth: 320,
        px: '$4',
        py: '$5',
        borderLeft: '1px solid $gray4',
        background: '$neutralBg',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '$5',
      }}
    >
      <Flex align="center" css={{ gap: '$3', mb: '$3' }}>
        <Avatar.Root>
          {ensAvatar ? (
            <Avatar.Image
              src={ensAvatar}
              alt={ensName || shortAddress}
              style={{ width: 40, height: 40, borderRadius: 20 }}
            />
          ) : (
            <Avatar.Fallback delayMs={0}>
              <Jazzicon diameter={40} seed={jsNumberForAddress(address)} />
            </Avatar.Fallback>
          )}
        </Avatar.Root>
        <Flex direction="column">
          <Text style="subtitle1">
            {shortEnsName ? shortEnsName : shortAddress}
          </Text>
          <Flex align="center" css={{ gap: '$1' }}>
            <Text style="body3" color="subtle">{address}</Text>
            <CopyText text={address} />
          </Flex>
        </Flex>
      </Flex>

      <Wallet />

      <Flex direction="column" css={{ gap: '$2', mt: '$2' }}>
        <Link href={`/portfolio/${address || ''}`} legacyBehavior>
          <a>
            <Flex align="center" css={{ gap: '$2', py: '$2', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faList} width={16} height={16} />
              <Text style="subtitle2">Portfolio</Text>
            </Flex>
          </a>
        </Link>
        <Link href="/" legacyBehavior>
          <a>
            <Flex align="center" css={{ gap: '$2', py: '$2', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faStore} width={16} height={16} />
              <Text style="subtitle2">Explore</Text>
            </Flex>
          </a>
        </Link>
        <Link href="/collection-rankings" legacyBehavior>
          <a>
            <Flex align="center" css={{ gap: '$2', py: '$2', cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faChartLine} width={16} height={16} />
              <Text style="subtitle2">Rankings</Text>
            </Flex>
          </a>
        </Link>
      </Flex>

      <Box css={{ mt: 'auto' }}>
        <ThemeSwitcher />
        <Button
          color="gray3"
          css={{ mt: '$4', width: '100%' }}
          onClick={() => disconnect()}
        >
          <FontAwesomeIcon icon={faRightFromBracket} width={16} height={16} style={{ marginRight: 8 }} />
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default AccountSidebar;
