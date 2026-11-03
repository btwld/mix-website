'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { RootProvider } from 'fumadocs-ui/provider/next';
import type { SharedProps } from 'fumadocs-ui/contexts/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import {
  SearchDialog, SearchDialogClose, SearchDialogContent, SearchDialogFooter, SearchDialogHeader, SearchDialogIcon,
  SearchDialogInput, SearchDialogList, SearchDialogListItem, SearchDialogOverlay, TagsList, TagsListItem,
} from 'fumadocs-ui/components/dialog/search';
import { createSearchClient } from '@/lib/search-client';
import { PROJECTS, PROJECT_IDS, type ProjectId } from '@/lib/projects.mjs';

function SiteSearchDialog(props: SharedProps) {
  const [project, setProject] = useState<ProjectId | null>(null);
  const { search, setSearch, query } = useDocsSearch({ client: createSearchClient(project) }, [project]);
  return <SearchDialog {...props} search={search} onSearchChange={setSearch} isLoading={query.isLoading}>
    <SearchDialogOverlay />
    <SearchDialogContent>
      <SearchDialogHeader><SearchDialogIcon /><SearchDialogInput placeholder="Search Mix, Remix, and Naked UI" /><SearchDialogClose /></SearchDialogHeader>
      {query.error && <p role="alert" className="p-4 text-sm">Search could not load. Reload the page to try again.</p>}
      <SearchDialogList
        items={query.data === 'empty' ? null : query.data}
        Item={({ item, onClick }) => <SearchDialogListItem item={item} onClick={onClick} data-result-url={'url' in item ? item.url : undefined} />}
      />
      <SearchDialogFooter>
        <TagsList tag={project ?? 'all'} onTagChange={tag => setProject(tag && tag !== 'all' ? tag as ProjectId : null)}>
          <TagsListItem value="all">All projects</TagsListItem>
          {PROJECT_IDS.map(id => <TagsListItem key={id} value={id}>{PROJECTS[id].name}</TagsListItem>)}
        </TagsList>
      </SearchDialogFooter>
    </SearchDialogContent>
  </SearchDialog>;
}

export function SiteProvider({ children }: { children: ReactNode }) {
  return <RootProvider search={{ SearchDialog: SiteSearchDialog }}>{children}</RootProvider>;
}
