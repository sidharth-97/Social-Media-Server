const queries = {
    verifyGoogleToken: async (parent: any, { token }: { token: String }) => {
        return token
    }
}

export const resolvers={queries}