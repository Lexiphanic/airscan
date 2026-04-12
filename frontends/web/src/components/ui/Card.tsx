interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card(props: CardProps) {
  return <div className={`bg-slate-900/80 border border-slate-700/50 backdrop-blur-sm rounded-lg overflow-hidden ${props.className}`}>
    {props.children}
  </div>
}