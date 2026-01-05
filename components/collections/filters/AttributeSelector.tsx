import React, { useMemo, useState } from "react"
import { FixedSizeList } from "react-window"



import { FixedSizeList } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useAttributes } from '@reservoir0x/reservoir-kit-ui'
import { Box, Flex, Switch, Text } from 'components/primitives'
import { useRouter } from 'next/router'
import { FC, useMemo, useState } from 'react'
import { addParam, hasParam, removeParam } from 'utils/router'

type Props = {
  attribute: NonNullable<ReturnType<typeof useAttributes>['data']>[0]
  scrollToTop: () => void
}

export const AttributeSelector: FC<Props> = ({ attribute, scrollToTop }) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const sortedAttributes = useMemo(() => {
    return attribute?.values?.sort((a, b) => {
      if (!a.count || !b.count) {
        return 0
      } else {
        return b.count - a.count
      }
    })
  }, [attribute])

  const AttributeRow = ({ index, style }: any) => {
    const currentAttribute = sortedAttributes?.[index]

    return (
      <Flex
        key={index}
        style={style}
        css={{ gap: '$3' }}
        align="center"
        onClick={() => {
          if (
            hasParam(
              router,
              `attributes[${attribute.key}]`,
              currentAttribute?.value
            )
          ) {
            removeParam(
              router,
              `attributes[${attribute.key}]`,
              currentAttribute?.value
            )
          } else {
            addParam(
              router,
              `attributes[${attribute.key}]`,
              currentAttribute?.value || ''
            )
          }
        }}
      >
        <Text style="body2" css={{ flex: 1 }}>
          {currentAttribute?.value}
        </Text>
        <Switch
          checked={hasParam(
            router,
            `attributes[${attribute.key}]`,
            currentAttribute?.value
          )}
          onCheckedChange={() => {
            if (
              hasParam(
                router,
                `attributes[${attribute.key}]`,
                currentAttribute?.value
              )
            ) {
              removeParam(
                router,
                `attributes[${attribute.key}]`,
                currentAttribute?.value
              )
            } else {
              addParam(
                router,
                `attributes[${attribute.key}]`,
                currentAttribute?.value || ''
              )
            }
          }}
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
            height: open
              ? sortedAttributes && sortedAttributes.length >= 7
                ? 300
                : (sortedAttributes?.length ?? 1) * 36
              : 0,
            itemCount: open ? (sortedAttributes?.length ?? 0) : 0,
            itemSize: 36,
            width: '100%',
            style: {
              overflow: 'auto',
              transition: 'max-height .3s ease-in-out',
            },
          },
          AttributeRow as any
        )}
      </Flex>
    </Box>
  )
}
