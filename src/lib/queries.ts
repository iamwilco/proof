import { useQuery } from "@tanstack/react-query";

export type ProjectSummary = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  fundingAmount: number;
  fundName: string;
};

export type PersonSummary = {
  id: string;
  name: string;
  aliases: string[];
  projectCount: number;
};

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

export const useProjects = (params?: { query?: string; fund?: string }) => {
  const search = new URLSearchParams();
  if (params?.query) search.set("q", params.query);
  if (params?.fund) search.set("fund", params.fund);
  const url = `/api/projects?${search.toString()}`;

  return useQuery({
    queryKey: ["projects", params],
    queryFn: () => fetchJson<ProjectSummary[]>(url),
  });
};

export const usePeople = (params?: { query?: string }) => {
  const search = new URLSearchParams();
  if (params?.query) search.set("q", params.query);
  const url = `/api/people?${search.toString()}`;

  return useQuery({
    queryKey: ["people", params],
    queryFn: () => fetchJson<PersonSummary[]>(url),
  });
};
