"use client"

import { Button, ButtonProps } from "@chakra-ui/react"
import { ReactElement } from "react"

export interface CopyButtonProps extends ButtonProps {
    text: string,
    value: string,
    icon?: ReactElement,
}

export default function CopyButton({
    text,
    value,
    icon,
    ...buttonProps
} : CopyButtonProps) {

    return (
        <Button {...buttonProps} onClick={() => navigator.clipboard.writeText(value)}>
            {icon} {text}
        </Button>
    )
}