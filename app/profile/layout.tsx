export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen -mt-[80px]" style={{ background: '#0b1120' }}>
      {children}
    </div>
  )
}
