import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useMemo, useState } from 'react'
import type { FC } from 'react'
import { FixedSizeList } from 'react-window'
import { useAttributes } from '@reservoir0x/reservoir-kit-ui'
import { Box, Flex, Switch, Text } from 'components/primitives'
import { useRouter } from 'next/router'
import { addParam, hasParam, removeParam } from 'utils/router'

type Props = {
  attribute: NonNullable<ReturnType<typeof useAttributes>['data']>[0]
  scrollToTop: () => void
}

export const AttributeSelector: FC<Props> = ({ attribute, scrollToTop }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const sortedAttributes = useMemo(() => {
    return attribute?.values
      ? [...attribute.values].sort((a, b) => {
          if (!a.value || !b.value) return 0
          return a.value.localeCompare(b.value)
        })
      : []
  }, [attribute])

  const Row: FC<{ index: number; style: React.CSSProperties; data: any }> = ({
    index,
    style,
    data,
  }) => {
    const value = data?.[index]
    if (!value) return null

    const attributeKey = `attributes[${attribute.key}]`
    const isSelected = hasParam(router, attributeKey, value?.value)

    const toggle = () => {
      if (isSelected) removeParam(router, attributeKey, value?.value || '')
      else addParam(router, attributeKey, value?.value || '')
      scrollToTop?.()
    }

    return (
      <div style={style}>
        <Flex css={{ gap: '$3' }} align="center" onClick={toggle}>
          <Text style="body2" css={{ flex: 1 }}>
            {value?.value}
          </Text>
          <Switch checked={isSelected} onCheckedChange={toggle} />
        </Flex>
      </div>
    )
  }

  const height = open ? (sortedAttributes.length >= 7 ? 264 : 132) : 0
  const itemCount = open ? sortedAttributes.length : 0

  return (
    <Box
      css={{
        pt: '$3',
        px: '$4',
        borderBottom: '1px solid $gray7',
        cursor: 'pointer',
        '@md': { px: '0' },
      }}
    >
      <Flex
        align="center"
        justify="between"
        css={{ mb: '$3', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Text as="h5" style="subtitle1" ellipsify>
          {attribute.key}
        </Text>
        <FontAwesomeIcon
          icon={faChevronDown}
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
            transition: '.3s',
          }}
          width={16}
          height={16}
        />
      </Flex>

      <Flex css={{ paddingBottom: open ? 8 : 0 }}>
        <FixedSizeList
          height={height}
          itemCount={itemCount}
          itemSize={44}
          width="100%"
          itemData={sortedAttributes}
        >
          {Row as any}
        </FixedSizeList>
      </Flex>
    </Box>
  )
}
