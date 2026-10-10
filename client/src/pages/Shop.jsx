
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const CATEGORIES = ['', 'Electronics', 'Fashion', 'Home & Living', 'Accessories'];
const SORTS = [['', 'Newest'], ['price', 'Price ↑'], ['-price', 'Price ↓'], ['rating', 'Top Rated']];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const page = Number(params.get('page') || 1);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: { q, category, sort, page, limit: 12 } })
      .then((r) => setData(r.data))
      .catch(() => setData({ products: [], pages: 1 }))
      .finally(() => setLoading(false));
    window.scrollTo(0, 0);
  }, [q, category, sort, page]);

  const setParam = (key, val) => {
    const next = new URLSearchParams(params);
    val ? next.set(key, val) : next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <main className="section">
      <div className="section-head">
        <h2>{q ? `Results for “${q}”` : category || 'All Products'}</h2>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
          {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
        </select>
      </div>

      <div className="filters">
        {CATEGORIES.map((c) => (
          <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setParam('category', c)}>
            {c || 'All'}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : !data.products.length ? (
        <div className="empty"><div className="big">🔍</div><h3>No products found</h3><p>Try a different search or category.</p></div>
      ) : (
        <>
          <div className="grid">{data.products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
          {data.pages > 1 && (
            <div className="pagination">
              {Array.from({ length: data.pages }, (_, i) => (
                <button key={i} className={page === i + 1 ? 'pg active' : 'pg'} onClick={() => setParam('page', String(i + 1))}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
