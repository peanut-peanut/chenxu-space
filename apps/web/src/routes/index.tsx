import { createRootRoute, createRoute, createRouter, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { Navbar } from '@/components/layout/Navbar'
import { HomePage } from '@/pages/home/HomePage'
import { ThoughtsPage } from '@/pages/thoughts/ThoughtsPage'
import { CatsPage } from '@/pages/cats/CatsPage'
import { ArticlesPage } from '@/pages/articles/ArticlesPage'
import { ArticleDetailPage } from '@/pages/articles/ArticleDetailPage'
import { ResourcesPage } from '@/pages/resources/ResourcesPage'
import { FilesPage } from '@/pages/files/FilesPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { AdminPage } from '@/pages/admin/AdminPage'

const rootRoute = createRootRoute({
  component: () => (
    <div className="relative">
      <Navbar />
      <Outlet />
      {import.meta.env.DEV && <TanStackRouterDevtools />}
    </div>
  ),
})

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage })
const dailyRoute = createRoute({ getParentRoute: () => rootRoute, path: '/daily', component: ThoughtsPage })
const catsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/cats', component: CatsPage })
const thoughtsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/thoughts', component: ThoughtsPage })
const articlesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/articles', component: ArticlesPage })
const articleDetailRoute = createRoute({ getParentRoute: () => rootRoute, path: '/articles/$slug', component: ArticleDetailPage })
const resourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/resources', component: ResourcesPage })
const filesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/files', component: FilesPage })
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: '/login', component: LoginPage })
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: '/register', component: RegisterPage })
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: '/profile', component: ProfilePage })
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: '/admin', component: AdminPage })

const routeTree = rootRoute.addChildren([
  homeRoute, dailyRoute, catsRoute, thoughtsRoute, articlesRoute, articleDetailRoute,
  resourcesRoute, filesRoute, loginRoute, registerRoute, profileRoute, adminRoute,
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
