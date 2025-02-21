import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import Image from 'next/image';
import { useCompare } from '@/lib/context/CompareContext';
import { formatNumber } from '@/lib/utils';

interface Props {
  isOpen: boolean;
  closeModal: () => void;
}

const CompareModal = ({ isOpen, closeModal }: Props) => {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();

  // Get products in reversed order once
  const productsToShow = [...compareProducts].reverse();

  const getImageUrl = (url: string | undefined): string => {
    if (!url) return '/assets/images/placeholder.jpg';
    return url.startsWith("//") ? `https:${url}` : url;
  };

  const formatPrice = (price: number | undefined): string => {
    return typeof price === 'number' ? formatNumber(price) : '0';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Compare Products
                  </Dialog.Title>
                  <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                    <Image src="/assets/icons/x-close.svg" alt="close" width={24} height={24} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {productsToShow.map((product) => (
                    <div key={product._id} className="border rounded-lg p-4">
                      <div className="relative">
                        <button
                          onClick={() => product._id && removeFromCompare(product._id)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <Image src="/assets/icons/x-close.svg" alt="remove" width={16} height={16} />
                        </button>
                        <Image
                          src={getImageUrl(product.image)}
                          alt={product.title || 'Product Image'}
                          width={200}
                          height={200}
                          className="mx-auto"
                        />
                      </div>
                      <h4 className="font-semibold mt-2">{product.title || 'Untitled Product'}</h4>
                      <p className="text-lg font-bold mt-2">
                        {product.currency || '$'}{formatPrice(product.currentPrice)}
                      </p>
                      <p className="text-sm text-gray-500 line-through">
                        {product.currency || '$'}{formatPrice(product.originalPrice)}
                      </p>
                      <div className="mt-4">
                        <h5 className="font-semibold">Description:</h5>
                        <p className="text-sm mt-1 line-clamp-4">{product.description || 'No description available'}</p>
                      </div>
                      <div className="mt-4">
                        <h5 className="font-semibold">Specifications:</h5>
                        <ul className="text-sm mt-1">
                          <li>Current Price: {product.currency || '$'}{formatPrice(product.currentPrice)}</li>
                          <li>Original Price: {product.currency || '$'}{formatPrice(product.originalPrice)}</li>
                          <li>Discount: {product.discountRate || 0}%</li>
                          <li>Reviews: {product.reviewsCount || 0}</li>
                          <li>Rating: {product.stars || 0} stars</li>
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {compareProducts.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={clearCompare}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CompareModal;
