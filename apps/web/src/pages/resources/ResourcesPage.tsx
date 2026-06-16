import { PageLayout, PageContainer } from '@/components/layout/PageLayout'
import { FilesManagerContent } from '@/pages/files/FilesPage'

export function ResourcesPage() {
  return (
    <PageLayout>
      <PageContainer>
        <FilesManagerContent title="资源" subtitle="文件归档与预览" />
      </PageContainer>
    </PageLayout>
  )
}
