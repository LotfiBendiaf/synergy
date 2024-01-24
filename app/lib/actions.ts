"use server";
import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath, unstable_noStore } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from 'next-auth';

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

const FormSchemaCustomer = z.object({
  id: z.string(),
  customer_name: z.string({
    invalid_type_error: 'Please enter a valid customer name.',
  }),
  email: z.string({
    invalid_type_error: 'Please select a valid email address.',
  })
});
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export type CustomerState = {
  errors?: {
    id?: string[];
    customer_name?: string[];
    email?: string[];
  };
  message?: string | null;
};

// ...
export async function createInvoice(prevState: State, formData: FormData) {
  unstable_noStore();
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];
  const month = new Date().toDateString().split(' ')[1];

  try {
    const rev = await sql`
    SELECT revenue FROM revenue WHERE month=${month}
    `;
    const oldRevenue = parseFloat(rev.rows[0]['revenue'])  
    const newRevenue = oldRevenue + amount

    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;

    if (status === 'paid'){
      await sql`
      UPDATE revenue 
      SET revenue = ${newRevenue}
      WHERE month = ${month}
      `;
    }

  } catch (error: any) {
    console.log(`Database Error: Failed to create invoice, ${error.message}`);
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// ...

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  unstable_noStore();
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const month = new Date().toDateString().split(' ')[1];

  try {
    const rev = await sql`
    SELECT revenue FROM revenue WHERE month=${month}
    `;
    const oldRevenue = parseFloat(rev.rows[0]['revenue'])  
    console.log("Old value : ", oldRevenue)
    const newRevenue = oldRevenue + amount
    console.log("New value : ", newRevenue)

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;

    if (status === 'paid'){
      await sql`
      UPDATE revenue 
      SET revenue = ${newRevenue}
      WHERE month = ${month}
      `;
    }

  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

const CreateCustomer = FormSchemaCustomer.omit({ id: true });

export async function createCustomer(prevState: CustomerState, formData: FormData) {
  unstable_noStore();
  const validatedFields = CreateCustomer.safeParse({
    customer_name: formData.get('name'),
    email: formData.get('email'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customer_name, email } = validatedFields.data;

  try{
    await sql `INSERT INTO customers (name, email)
    VALUES (${customer_name}, ${email})`
  }catch (error) {
    console.log(error)
    return { message: 'Database Error: Failed to Create Customer.' };
  }
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

// Use Zod to update the expected types
const UpdateCustomer = FormSchemaCustomer.omit({ id: true });


export async function updateCustomer(
  id: string,
  prevState: CustomerState,
  formData: FormData,
) {
  unstable_noStore();
  const validatedFields = UpdateCustomer.safeParse({
    customer_name: formData.get('name'),
    email: formData.get('email'),
  });
 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Customer.',
    };
  }
  const { customer_name, email } = validatedFields.data;

  try {
    await sql`
    UPDATE customers 
    SET name=${customer_name}, email=${email}
    WHERE id = ${id}`;

  } catch (error) {
    return { message: 'Database Error: Failed to Update Customer.' };
  }
 
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteInvoice(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error: any) {
    console.log(`Database Error: Failed to Delete Invoice. ${error.message}`);
  }
  revalidatePath("/dashboard/invoices");
}

export async function deleteCustomer(id: string) {
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
  } catch (error: any) {
    console.log(`Database Error: Failed to Delete Invoice. ${error.message}`);
  }
  revalidatePath("/dashboard/invoices");
}
 
export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}