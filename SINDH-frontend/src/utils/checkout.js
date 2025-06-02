import { client } from '../shopify-client';

export async function checkout(cart) {
  // Format line items for Shopify API
  const lineItems = cart.map(item => ({
    variantId: item.variantId,
    quantity: item.quantity
  }));

  const { data } = await client.mutation({
    mutation: `mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout { webUrl }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }`,
    variables: {
      input: { lineItems }
    }
  });

  if (data.checkoutCreate.checkoutUserErrors.length > 0) {
    console.error('Checkout error:', data.checkoutCreate.checkoutUserErrors);
    throw new Error('Failed to create checkout');
  }

  return data.checkoutCreate.checkout.webUrl;
}
