interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card(props: CardProps) {
  return <div className={`neobrutalist-card ${props.className}`}>
    {props.children}
  </div>
}