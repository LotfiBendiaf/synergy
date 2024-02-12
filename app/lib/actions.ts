"use server";
import { string, z } from "zod";
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
  project_name: z.string({
    invalid_type_error: 'Please enter a project name or description.',
  }),
  amount: z.coerce
    .number()
    .gte(0, { message: 'Please enter an amount greater than $0.' }),
  remaining: z.coerce
    .number()
    .gte(0, { message: 'Please enter an amount greater or equal than $0.' }),
  progress: z.coerce
    .number()
    .gte(0, { message: 'Please enter a correct percetage (%) value' })
    .lte(100, { message: 'Please enter a percetage less or equal to 100%' }),
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
const CreateInvoice = FormSchema.omit({ id: true});

export type State = {
  errors?: {
    customerId?: string[];
    project_name?: string[];
    amount?: string[];
    remaining?: string[];
    progress?: string[];
    date?: string[];
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
    project_name: formData.get('project'),
    amount: formData.get('amount'),
    remaining: formData.get('remaining'),
    progress: formData.get('progress'),
    date: formData.get('date'),
    status: formData.get('status'),
  });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, project_name, amount, remaining, progress, date, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const remainingInCents = remaining * 100;
  const monthDate = date.split('-')[1];
  let month
  switch(parseInt(monthDate)) {
    case 1:
      month = 'Jan';
      break;
    case 2:
      month = 'Feb';
      break;
    case 3:
      month = 'Mar';
      break;
    case 4:
      month = 'Apr';
      break;
    case 5:
      month = 'May';
      break;
    case 6:
      month = 'Jun';
      break;
    case 7:
      month = 'Jul';
      break;
    case 8:
      month = 'Aug';
      break;
    case 9:
      month = 'Sep';
      break;
    case 10:
      month = 'Oct';
      break;
    case 11:
      month = 'Nov';
      break;
    case 12:
      month = 'Dec';
      break;
  }

  try {
    const rev = await sql`
    SELECT revenue FROM revenue WHERE month=${month}
    `;
    const oldRevenue = parseFloat(rev.rows[0]['revenue'])  

    const newRevenue = oldRevenue + amount
    
    await sql`
    INSERT INTO invoices (customer_id, project_name, amount, remaining, progress, status, date)
    VALUES (${customerId}, ${project_name}, ${amountInCents}, ${remainingInCents}, ${progress}, ${status}, ${date})
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
const UpdateInvoice = FormSchema.omit({ id: true });

// ...

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  unstable_noStore();
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    project_name: formData.get('project'),
    amount: formData.get('amount'),
    remaining: formData.get('remaining'),
    progress: formData.get('progress'),
    date: formData.get('date'),
    status: formData.get('status'),
  });

 
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  const { customerId, project_name, amount, remaining, progress, date, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const remainingInCents = remaining * 100;
  const month = new Date().toDateString().split(' ')[1];

  
  const current_month = new Date(date)

  try {
    const rev = await sql`
    SELECT revenue FROM revenue WHERE month=${month}
    `;
    const oldRevenue = parseFloat(rev.rows[0]['revenue'])  
    const newRevenue = oldRevenue + amount

    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, project_name = ${project_name}, amount = ${amountInCents}, remaining = ${remainingInCents}, progress = ${progress}, date = ${date}, status = ${status}
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
    console.log(error)
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
    await sql `INSERT INTO customers (name, email, image_url)
    VALUES (${customer_name}, ${email}, '/customers/user.png')`
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