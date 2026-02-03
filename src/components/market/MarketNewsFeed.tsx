import { useNews, getSentimentColor } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function MarketNewsFeed() {
  const { data: news, isLoading } = useNews();

  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-4">
        <Skeleton className="h-4 w-32 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="h-3 w-3" />;
      case 'negative': return <TrendingDown className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Market Intelligence</h3>
        <span className="text-[10px] text-muted-foreground">AI-Curated</span>
      </div>

      <div className="space-y-3">
        {news?.slice(0, 4).map((item) => (
          <div key={item.id} className="group">
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 p-1 rounded-full ${getSentimentColor(item.sentiment)}`}>
                {getSentimentIcon(item.sentiment)}
              </span>
              <div className="flex-1 min-w-0">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:text-accent transition-colors line-clamp-2 flex items-start gap-1"
                >
                  {item.title}
                  <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-muted-foreground">{item.source}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {news && news.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No news available</p>
      )}
    </div>
  );
}
