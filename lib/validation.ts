import { z } from "zod"

const productSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  price: z.number().positive(),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
})

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    }),
  ),
  customerInfo: z.object({
    email: z.string().email(),
    name: z.string().min(1),
  }),
})

export function validateInput(data: any, endpoint: string) {
  try {
    if (endpoint.includes("/products")) {
      productSchema.parse(data)
    } else if (endpoint.includes("/orders")) {
      orderSchema.parse(data)
    }
    return { isValid: true, errors: [] }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, errors: error.errors }
    }
    return { isValid: false, errors: ["Invalid input"] }
  }
}
