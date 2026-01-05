import React, { FC, useMemo, useState } from 'react'
import { FixedSizeList } from 'react-window'
import type { ListChildComponentProps } from 'react-window'

import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
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
    return attribute?.values ? [...attribute.values].sort((a, b) => {
      if (!a.value || !b.value) return 0
      return a.value.localeCompare(b.value)
    }) : []
  }, [attribute])

  const AttributeRow = ({ index, style }: any) => {
    const currentAttribute = sortedAttributes?.[index]
    const attributeKey = `attributes[${attribute.key}]`
    const isSelected = hasParam(router, attributeKey, currentAttribute?.value)

    const handleToggle = () => {
      if (isSelected) removeParam(router, attributeKey, currentAttribute?.value || '')
      else addParam(router, attributeKey, currentAttribute?.value || '')
      scrollToTop?.()
    }

    return (
      <Flex
        key={index}
        style={style}
        css={{ gap: '$3' }}
        align="center"
        onClick={handleToggle}
      >
        <Text style="body2" css={{ flex: 1 }}>
          {currentAttribute?.value}
        </Text>
        <Switch
          checked={isSelected}
          onCheckedChange={handleToggle}
        />
      </Flex>
    )
  }

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
        {React.createElement(
          FixedSizeList as unknown as React.ComponentType<any>,
          {
            height: open ? (sortedAttributes?.length >= 7 ? 264 : 132) : 0,
            itemCount: open ? sortedAttributes?.length ?? 0 : 0,
            itemSize: 44,
            width: '100%',
            itemData: sortedAttributes,
          },
          ({ index, style, data }: any) => {
            const value = data?.[index]
            if (!value) return null

            return (
              <div style={style}>
                {/* keep existing checkbox / label UI */}
                <Flex
                  key={index}
                  css={{ gap: '$3' }}
                  align="center"
                  onClick={() => {
                    const attributeKey = `attributes[${attribute.key}]`
                    const isSelected = hasParam(router, attributeKey, value?.value)
                    if (isSelected) removeParam(router, attributeKey, value?.value || '')
                    else addParam(router, attributeKey, value?.value || '')
                    scrollToTop?.()
                  }}
                >
                  <Text style="body2" css={{ flex: 1 }}>
                    {value?.value}
                  </Text>
                  <Switch
                    checked={hasParam(router, `attributes[${attribute.key}]`, value?.value)}
                    onCheckedChange={() => {
                      const attributeKey = `attributes[${attribute.key}]`
                      const isSelected = hasParam(router, attributeKey, value?.value)
                      if (isSelected) removeParam(router, attributeKey, value?.value || '')
                      else addParam(router, attributeKey, value?.value || '')
                      scrollToTop?.()
                    }}
                  />
                </Flex>
              </div>
            )
          }
        )}
      </Flex>
    </Box>
  )
}
