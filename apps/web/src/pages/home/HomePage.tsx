import { motion } from 'framer-motion'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen, Lightbulb, FolderOpen, Github, Mail } from 'lucide-react'
import { ParticleCanvas } from '@/components/common/ParticleCanvas'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageLayout } from '@/components/layout/PageLayout'

const features = [
  {
    icon: Lightbulb,
    title: '想法',
    desc: '记录生活碎片与瞬间灵感，分享日常的所思所感',
    to: '/thoughts',
    color: 'from-violet-500/20 to-purple-500/10',
    border: 'hover:border-violet-500/40',
  },
  {
    icon: BookOpen,
    title: '文章',
    desc: '深度技术分享与思考，探索代码世界的边界',
    to: '/articles',
    color: 'from-cyan-500/20 to-blue-500/10',
    border: 'hover:border-cyan-500/40',
  },
  {
    icon: FolderOpen,
    title: '资源',
    desc: '图片、视频与文件的私人仓库，记录美好与收藏',
    to: '/resources',
    color: 'from-emerald-500/20 to-teal-500/10',
    border: 'hover:border-emerald-500/40',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
}

export function HomePage() {
  return (
    <PageLayout>
      {/* Hero */}
      <section className="relative min-h-[calc(100vh-56px)] flex items-center overflow-hidden">
        <ParticleCanvas />

        {/* Gradient blobs */}
        <div className="absolute -top-10 -left-20 w-[700px] h-[600px] bg-[var(--color-accent)]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 -right-20 w-[600px] h-[500px] bg-[var(--color-cyan)]/12 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-purple-900/25 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-20">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-2xl"
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent-glow)] text-[var(--color-accent)] text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] animate-pulse" />
              Welcome to my space
            </motion.div>

            <motion.h1 variants={item} className="text-5xl md:text-6xl font-bold leading-tight text-[var(--color-text-primary)] mb-4">
              Hi, 我是{' '}
              <span className="gradient-text">Chen Xu</span>
            </motion.h1>

            <motion.p variants={item} className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-xl">
              一个热爱代码与设计的开发者。这里记录我的思考、创作与探索——
              技术文章、生活碎片、以及一切值得留存的东西。
            </motion.p>

            <motion.div variants={item} className="flex items-center gap-3 flex-wrap">
              <Link to="/thoughts">
                <Button size="lg" className="gap-2">
                  探索想法
                  <ArrowRight size={16} />
                </Button>
              </Link>
              <Link to="/articles">
                <Button variant="secondary" size="lg">
                  阅读文章
                </Button>
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-4 mt-10">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Github size={20} />
              </a>
              <a
                href="mailto:hi@chenxu.xyz"
                className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Mail size={20} />
              </a>
              <span className="text-[var(--color-border-2)] select-none">|</span>
              <span className="text-xs text-[var(--color-text-tertiary)]">chenxu.xyz</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-[var(--color-border-2)]" />
          <span className="text-[10px] text-[var(--color-text-tertiary)] tracking-widest uppercase">scroll</span>
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
        >
          <motion.div variants={item} className="mb-12 text-center">
            <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">
              我的空间
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">探索不同维度的内容</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {features.map(({ icon: Icon, title, desc, to, color, border }) => (
              <motion.div key={to} variants={item}>
                <Link to={to} className="block h-full">
                  <Card
                    hover
                    glow
                    className={`h-full border-[var(--color-border)] ${border} transition-all duration-300`}
                  >
                    <CardContent className="p-6">
                      <div className={`inline-flex p-3 rounded-[var(--radius-md)] bg-gradient-to-br ${color} mb-4`}>
                        <Icon size={20} className="text-[var(--color-text-primary)]" />
                      </div>
                      <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
                      <div className="flex items-center gap-1 mt-4 text-xs text-[var(--color-accent)]">
                        查看更多 <ArrowRight size={12} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-8 text-center">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} chenxu.xyz — Built with ♥
        </p>
      </footer>
    </PageLayout>
  )
}
