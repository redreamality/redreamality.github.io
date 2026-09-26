---
title: 'How to See Who Starred Your GitHub Repository'
pubDate: 2025-08-22T16:18:23.681Z
description: 'See who starred a GitHub repository using its Stargazers page. Find the URL, understand access limits, and distinguish stars from watchers.'
author: 'Remy'
tags: ['development']
---

Open the repository's **Stargazers** page by adding `/stargazers` to its URL. Whether you can see the users depends on your account's permissions: a public repository does not guarantee public access to its stargazers. GitHub's [June 30, 2026 announcement](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/) restricts the listing API to admins and collaborators and also restricts the corresponding web views.

## Open the Stargazers Page

The most straightforward method is to manually add /stargazers to the end of your repository's URL.

For example, if your repository's URL is:
`https://github.com/your-username/your-repository-name`

You would navigate to:
`https://github.com/your-username/your-repository-name/stargazers`

This is the entry point for the repository's stargazer list, subject to those restrictions. You can also click the star count on the repository page. Click the count rather than the **Star** action, which changes whether you have starred the repository yourself.

## Can I See Stars on a Private Repository?

You must sign in with an account that can access the private repository. That is a necessary check, not a guarantee of access to the stargazer list. A Stargazers URL does not bypass repository permissions; check the admin or collaborator access required for the listing too.

## Why Is the List Empty or Returning 403?

GitHub's announcement says some users may receive an empty response or **403 Forbidden**. An empty list therefore does not, by itself, prove that nobody has starred the repository. Check the signed-in account, repository name and admin/collaborator access first. For API requests, also check the response body and rate-limit headers; not every 403 has the same cause.

The [REST starring reference](https://docs.github.com/en/rest/activity/starring#list-stargazers) dates the new restrictions to July 2026. Its general public-resource authentication wording and the [ordinary stars help page](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars#viewing-who-has-starred-a-repository) still contain broader access language. Read those alongside the newer restriction notice, not as a promise of unrestricted access. This article does not establish rollout status for every account.

## Current Stargazers Are Not a Complete History

The page and `GET /repos/{owner}/{repo}/stargazers` list current stargazers, not every person who ever starred and later unstarred the repository. The REST list is paginated: the default is 30 results per page and the maximum `per_page` is 100. One page is not necessarily the complete current list.

The `application/vnd.github.star+json` media type includes `starred_at` for returned entries; that timestamp does not turn the list into an unstar event log. The separate [repository star history endpoint](https://docs.github.com/en/rest/activity/starring#get-repository-star-history) provides historical counts, not a complete history of individual identities. Neither endpoint bypasses access restrictions.

## Are Stargazers the Same as Watchers?

No. Stars let people save repositories; watching controls notifications about repository activity. The Stargazers page shows stars, not everyone who watches, visits, or clones the repository.

## Official Sources

- [Access restriction announcement, June 30, 2026](https://github.blog/changelog/2026-06-30-upcoming-access-restrictions-to-public-api-endpoints-and-ui-views/): API and web-view restrictions, empty responses and 403.
- [REST endpoints for starring](https://docs.github.com/en/rest/activity/starring): listing permissions, pagination, timestamps and historical counts.
- [Saving repositories with stars](https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars): navigation and the purpose of stars; read with the newer restrictions above.
