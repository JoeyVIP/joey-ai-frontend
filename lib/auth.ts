import { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Sync user with backend
      if (account?.provider === "github" && profile) {
        try {
          const githubProfile = profile as any
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/github-login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              github_id: githubProfile.id || account.providerAccountId,
              username: githubProfile.login || user.name,
              email: user.email,
              avatar_url: user.image,
            }),
          })

          if (!response.ok) {
            console.error("Failed to sync user with backend")
            return false
          }

          const backendUser = await response.json()
          // Store backend user ID in session
          user.id = backendUser.id
        } catch (error) {
          console.error("Error syncing user:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.accessToken = account.access_token
      }
      if (profile) {
        const githubProfile = profile as any
        token.githubId = githubProfile.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.githubId = token.githubId as string
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
}
