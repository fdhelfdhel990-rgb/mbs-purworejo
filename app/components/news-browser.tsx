"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { NewsArticle } from "../data/news";
import { safeImageUrl } from "../data/image-utils";

const perPage = 9;
const iconClass = "material-symbol";

export default function NewsBrowser({ articles }: { articles: NewsArticle[] }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua Berita");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const defaultCats = ["Kegiatan", "Pendidikan", "Prestasi"];
    const set = new Set<string>(defaultCats);
    articles.forEach((a) => {
      if (a.category && a.category.trim()) set.add(a.category.trim());
    });
    return Array.from(set);
  }, [articles]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase("id");
    return articles.filter((article) => {
      const matchesCategory = category === "Semua Berita" || article.category === category;
      const matchesQuery = !normalized || `${article.title} ${article.excerpt} ${article.category}`.toLocaleLowerCase("id").includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [articles, category, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearch(query);
    setPage(1);
  };

  const updateCategory = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setCategory(event.target.value);
    setPage(1);
  };

  return (
    <>
      <form className="news-search" onSubmit={submitSearch}>
        <label className="news-search-field">
          <span className={iconClass} aria-hidden="true">search</span>
          <input
            aria-label="Cari berita"
            placeholder="Masukkan kata kunci..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button type="submit">Cari</button>
      </form>

      <div className="news-toolbar">
        <p>Menampilkan <strong>{filtered.length}</strong> Berita</p>
        <label className="news-filter">
          <span>Jenis Publikasi</span>
          <select value={category} onChange={updateCategory} aria-label="Filter jenis publikasi">
            <option value="Semua Berita">Semua Berita</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>
      </div>

      {visible.length ? (
        <div className="news-page-grid">
          {visible.map((article, index) => (
            <Link className="news-card" href={`/berita/detail?id=${article.id}`} key={`${article.id}-${index}`} aria-label={`Baca detail berita: ${article.title}`}>
              <div className="news-image"><Image src={safeImageUrl(article.image)} alt={`Foto: ${article.title}`} fill sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw" /></div>
              <div className="news-copy">
                <span className="news-date">{article.date}</span>
                <span className="news-category">{article.category}</span>
                <h2>{article.title}</h2>
                <p>{article.excerpt}</p>
                <span className="news-card-readmore">Baca selengkapnya <span aria-hidden="true">→</span></span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="news-empty">
          <span className={iconClass} aria-hidden="true">search_off</span>
          <p>Berita tidak ditemukan. Coba kata kunci atau jenis publikasi lain.</p>
        </div>
      )}

      {filtered.length > perPage && (
        <nav className="news-pagination" aria-label="Navigasi halaman berita">
          <button type="button" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>
            <span className={iconClass} aria-hidden="true">chevron_left</span>
          </button>
          {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
            <button className={currentPage === pageNumber ? "is-current" : ""} key={pageNumber} type="button" aria-current={currentPage === pageNumber ? "page" : undefined} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
          ))}
          <button type="button" aria-label="Halaman berikutnya" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>
            <span className={iconClass} aria-hidden="true">chevron_right</span>
          </button>
        </nav>
      )}
    </>
  );
}
