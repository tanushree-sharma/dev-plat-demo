import { json } from '@remix-run/cloudflare';
import type { LoaderFunction } from '@remix-run/cloudflare';
import { useLoaderData } from '@remix-run/react';
import { Client } from 'pg';


interface Env {
  DB: D1Database;
  DB_URL: String;
}

interface CountResult {
  count: number;
  maxId: number;
}

export const loader: LoaderFunction = async ({ context }) => {
  const env = context.cloudflare.env as Env;
  
  if (!env.DB) {
    console.error('D1 database is not bound to the environment');
    return json({ error: 'Database not available' }, { status: 500 });
  }

  try {

    console.log("quering D1")
    // Query the D1 database. Split data into 3 queries 
    const countResult = await env.DB.prepare("SELECT COUNT(*) as count, MAX(id) as maxId FROM users").first<CountResult>();

    if (!countResult) {
      return new Response(JSON.stringify({ error: 'No data found in the users table' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const totalCount = countResult.count;
    const maxId = countResult.maxId;

    const partSize = Math.ceil(totalCount / 3);

    console.log("starting queries")


    // Query for the first part
    const part1Result = await env.DB.prepare(
      "SELECT * FROM users WHERE id <= ? ORDER BY id LIMIT ?"
    ).bind(Math.floor(maxId / 3), partSize).all();

    // Query for the second part
    const part2Result = await env.DB.prepare(
      "SELECT * FROM users WHERE id > ? AND id <= ? ORDER BY id LIMIT ?"
    ).bind(Math.floor(maxId / 3), Math.floor(2 * maxId / 3), partSize).all();

    // Query for the third part
    const part3Result = await env.DB.prepare(
      "SELECT * FROM users WHERE id > ? ORDER BY id LIMIT ?"
    ).bind(Math.floor(2 * maxId / 3), partSize).all();

    const results = [
      ...part1Result.results,
      ...part2Result.results,
      ...part3Result.results
    ];
    console.log("finished queries")


    console.log(results)


    // const client = new Client({
    //   connectionString: env.DB_URL,
    // });
    // await client.connect();
    // const neonResult = await client.query('SELECT * FROM users LIMIT 5');
    // const neonUsers = neonResult.rows;
    // await client.end();
  
    //return json({results, neonUsers });
    return json({results});

  } catch (error) {
    console.error('Error querying database:', error);
    return json({ error: 'Failed to query database' }, { status: 500 });
  }
};

export default function Index() {
  const data = useLoaderData<typeof loader>();

  if ('error' in data) {
    return <div>Error: {data.error}</div>;
  }

  //const { results, neonUsers } = data;
  const { results } = data;


  return (
    <div style={{
      fontFamily: "system-ui, sans-serif",
      lineHeight: "1.4",
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      textAlign: "center"
    }}>
      <h1>Welcome to our Remix project build on Cloudflare Workers!</h1>
      
      {/* Cloudflare logo */}
      <img 
        src="https://www.cloudflare.com/img/logo-web-badges/cf-logo-on-white-bg.svg" 
        alt="Cloudflare Logo" 
        style={{ width: "200px"}}
        className="mx-auto"
      />
      <div className="px-4 sm:px-6 lg:px-8  text-left">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Users</h1>
        </div>
        <p> The Worker makes 3 requests to D1 to pull data from the Users table</p>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {results.map((person) => (
                    <tr key={person.email}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {person.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* <div className="px-4 sm:px-6 lg:px-8  text-left">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Neon Users</h1>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        </div>
      </div>
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {neonUsers.map((person) => (
                    <tr key={person.email}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {person.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div> */}
    </div>
  );
}
