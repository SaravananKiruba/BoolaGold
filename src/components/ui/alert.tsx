"use client"

import { Alert as ChakraAlert } from "@chakra-ui/react"
import { forwardRef } from "react"

interface AlertRootProps extends ChakraAlert.RootProps {
  icon?: React.ReactNode
}

export const Alert = Object.assign(
  {},
  {
    Root: forwardRef<HTMLDivElement, AlertRootProps>(
      function AlertRoot(props, ref) {
        return <ChakraAlert.Root ref={ref} {...props} />
      }
    ),
    Content: ChakraAlert.Content,
    Description: ChakraAlert.Description,
    Indicator: ChakraAlert.Indicator,
    Title: ChakraAlert.Title,
  }
)
