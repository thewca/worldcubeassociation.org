import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    {
      id: "WCA",
      name: "WCA-OIDC-Provider",
      type: "oauth",
      issuer: "http://localhost:3000",
      clientId: "hMLgmJwMyCQaGs5F_X-KGjPGlZJ8GA0K1-5mWVJinFw",
      clientSecret: "9CoxlAI6FbCrq87qViedhPkFLBIMG0sVcFBo56HppLQ",
    },
  ],
  secret: "aaaa",
})
