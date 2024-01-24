import Form from '@/app/ui/customers/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { Metadata } from 'next';


export const metadata: Metadata = {
    title: 'Customer Create',
  };
 
export default async function Page() {
 
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Customers', href: '/dashboard/customers' },
          {
            label: 'Create customer',
            href: '/dashboard/customers/create',
            active: true,
          },
        ]}
      />
      <Form/>
    </main>
  );
}