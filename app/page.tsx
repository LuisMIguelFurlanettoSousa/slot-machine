import SlotMachine from "@/components/slot-machine"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-yellow-400 mb-8 text-center">
        Caça-Níquel <span className="text-white">Virtual</span>
      </h1>
      <SlotMachine />
    </main>
  )
}
