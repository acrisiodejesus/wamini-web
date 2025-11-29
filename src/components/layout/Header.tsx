import Sidebar from "./Sidebar";

export function Header() {
  return(
    <header className="bg-white p-4 md:p-6  md:shadow-sm sticky top-0 z-10">
              <div className='flex justify-between items-center'>
                <h1 className="text-2xl md:text-3xl font-black logo-wamini">
                  Wamini
                </h1>
                <div className="flex gap-3">
                  <LanguageSwitcher />
                  <Link href="/settings" className="p-2 rounded-full hover:bg-gray-100">
                    <Settings size={24} />
                  </Link>
                </div>
              </div>
            <Sidebar />
            </header>
  )
}