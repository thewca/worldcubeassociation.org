import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  providers: [
    {
      id: "WCA",
      name: "WCA-OIDC-Provider",
      type: "oauth",
      issuer: "http://wca_on_rails:3000",
      clientId: "k3cCulPkUe6BCYAB8xP1v4eYMxvKZdzUwH0K3-0R_H0",
      clientSecret: "euFyUD_CTFiSv7mRX0z77LBUQ9teHQo6checdcXSWzc",
    },
  ],
})
