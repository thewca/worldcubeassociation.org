import { Image, Card } from "@chakra-ui/react"

interface MarkdownFirstImageProps {
  content: string
  alt?: string
}

export const MarkdownFirstImage = ({ content, alt = "Image" }: MarkdownFirstImageProps) => {
  const match = content.match(/!\[.*?\]\((.*?)\)/)

  if (!match) return null

  const imageUrl = match[1]

  return (
    <Card.Root variant="plain">
        <Card.Body justifyContent="center">
            <Image src={imageUrl} alt={alt} maxW="100%" borderRadius="md" />
        </Card.Body>
    </Card.Root>
  
  )
}
