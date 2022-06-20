import {
  useLocalization,
  useShopQuery,
  Seo,
  gql,
  Image,
  CacheLong,
  type HydrogenRouteProps,
} from '@shopify/hydrogen';
import type {Blog} from '@shopify/hydrogen/storefront-api-types';

import {CustomFont, PageHeader, Section} from '~/components';
import {Layout} from '~/components/index.server';
import {ATTR_LOADING_EAGER} from '~/lib/const';

const BLOG_HANDLE = 'journal';

export default function Post({params, response}: HydrogenRouteProps) {
  response.cache(CacheLong());
  const {
    language: {isoCode: languageCode},
    country: {isoCode: countryCode},
  } = useLocalization();

  const {handle} = params;
  const {data} = useShopQuery<{
    blog: Blog;
  }>({
    query: ARTICLE_QUERY,
    variables: {
      language: languageCode,
      blogHandle: BLOG_HANDLE,
      articleHandle: handle,
    },
  });

  if (!data?.blog?.articleByHandle) {
    return <div>Article not found</div>;
  }

  // VS Code intellisense is telling me that `author` is deprecated:
  // https://screenshot.click/Screen_Shot_2022-06-20_at_12.59.49.png
  const {title, publishedAt, contentHtml, author} = data.blog.articleByHandle;
  const formattedDate = new Intl.DateTimeFormat(
    `${languageCode}-${countryCode}`,
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    },
  ).format(new Date(publishedAt));

  return (
    <Layout>
      {/* Loads Fraunces custom font only on articles */}
      {/* Why load a different font here? Is it intended to demonstrate custom font loading, or just cosmetic? */}
      <CustomFont />
      {/* @ts-expect-error Blog article types are not supported in TS */}
      <Seo type="page" data={data.blog.articleByHandle} />
      <PageHeader heading={title} variant="blogPost">
        <span>
          {formattedDate} &middot; {author.name}
        </span>
      </PageHeader>
      <Section as="article" padding="x">
        {data.blog.articleByHandle.image && (
          <Image
            data={data.blog.articleByHandle.image}
            className="w-full mx-auto mt-8 md:mt-16 max-w-7xl"
            sizes="90vw"
            widths={[800, 1600, 2400]}
            // Is the "100" here for 100% width? In vanilla HTML this would be pixels, no?
            width="100"
            loading={ATTR_LOADING_EAGER}
          />
        )}
        <div
          // Maybe worth explaining why we're OK with a dangerouslySet prop in this case.
          // Under what circumstances should you _not_ do this?
          dangerouslySetInnerHTML={{__html: contentHtml}}
          className="article"
        />
      </Section>
    </Layout>
  );
}

const ARTICLE_QUERY = gql`
  query ArticleDetails(
    $language: LanguageCode
    $blogHandle: String!
    $articleHandle: String!
  ) @inContext(language: $language) {
    blog(handle: $blogHandle) {
      articleByHandle(handle: $articleHandle) {
        title
        contentHtml
        publishedAt
        author: authorV2 {
          name
        }
        image {
          id
          altText
          url
          width
          height
        }
      }
    }
  }
`;
