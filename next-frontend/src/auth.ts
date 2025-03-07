import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    {
      id: "WCA",
      name: "WCA-OIDC-Provider",
      type: "oidc",
      issuer: process.env.OIDC_ISSUER,
      clientId: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
    },
  ],
  callbacks: {
    jwt({ token, trigger, session, account }) {
      if(trigger === "signIn" || trigger === "update"){
        return { ...token, accessToken: account?.access_token, userId: account?.userId }
      }
      return { ...token };
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.user.id = token.userId
      return session
    }
  }
})
