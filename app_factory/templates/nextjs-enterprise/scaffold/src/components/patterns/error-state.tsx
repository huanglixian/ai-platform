export function ErrorState({ title = "页面暂时无法加载", description }: { title?: string; description?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <p className="font-medium">{title}</p>
      {description ? <p className="mt-1 text-red-700">{description}</p> : null}
    </div>
  );
}
