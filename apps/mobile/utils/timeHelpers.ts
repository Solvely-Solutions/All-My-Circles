export function getRelativeTimeString(date: string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday"; 
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 14) return "Last week";
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 60) return "Last month";
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} year${Math.floor(diffInDays / 365) > 1 ? 's' : ''} ago`;
}

export function getTimeGrouping(date: string): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInMs = now.getTime() - targetDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return "This Week";
  if (diffInDays < 14) return "Last Week";
  if (diffInDays < 30) return "This Month";
  if (diffInDays < 60) return "Last Month";
  return "Earlier";
}