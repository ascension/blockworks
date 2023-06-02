import Head from 'next/head'

export default function Layout({
                                   children
                               }: {
    children: React.ReactNode
    home?: boolean
}) {
    return (
        <div>
            <Head>
                <link rel="icon" href="/favicon.ico"/>
                <meta
                    name="description"
                    content=""
                />
                <meta name="og:title" content="BTC Addresses"/>
                <meta name="twitter:card" content="summary_large_image"/>
            </Head>
            <header>
                <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
                    <div className="mx-auto max-w-2xl sm:text-center">
                        <h2 className="text-lg font-semibold leading-8 tracking-tight text-indigo-600">Blockworks
                            Interview Challenge</h2>
                        <p className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">BTC Address
                            Balances over Time</p>
                    </div>
                </div>
            </header>
            <main>
                {children}
            </main>
        </div>
    )
}
