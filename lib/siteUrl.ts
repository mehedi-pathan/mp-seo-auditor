const productionAppUrl = 'https://mp-seo-auditor.netlify.app'

const isLocalUrl = (value: string) =>
  value.includes('localhost') ||
  value.includes('127.0.0.1') ||
  value.includes('0.0.0.0') ||
  value.includes('::1')

export const getPublicAppUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (!envUrl || isLocalUrl(envUrl)) {
    return productionAppUrl
  }

  return envUrl.replace(/\/$/, '')
}

export const publicAppUrl = getPublicAppUrl()
