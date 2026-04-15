interface SeoIntroProps {
  title: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
}

export function SeoIntro({ title, description, seoTitle, seoDescription }: SeoIntroProps) {
  return (
    <div className="mb-8">
      <div hidden aria-hidden="true" data-seo-title={seoTitle} data-seo-description={seoDescription} />
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 break-words">{title}</h1>
      <p className="text-gray-600 text-base sm:text-lg max-w-3xl leading-relaxed">{description}</p>
    </div>
  );
}
