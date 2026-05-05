interface PageHeadingProps {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeading({ title, description, children }: PageHeadingProps) {
  return (
    <header className="page-header flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold text-primary">{title}</h2>
        {description ? <p className="text-secondary mt-1">{description}</p> : null}
      </div>

      {children ? <div className="flex gap-3 items-center">{children}</div> : null}
    </header>
  )
}
