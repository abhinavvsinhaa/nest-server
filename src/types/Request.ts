import { User } from "@prisma/client"

interface MePayload {
    user: User
}

export type MeRequest = MePayload