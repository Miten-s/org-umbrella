import { useContext, useMemo, useState, type ReactNode } from "react";
import Button from "@/components/ui/button/Button";
import { PlusIcon } from "@/public/icons";
import {
  FormHeaderContext,
  type HeaderAction,
  type Registry
} from "./formHeaderContext";

/** Lets sub-lists anywhere in a form put their Add button in the form's header. */
export const FormHeaderProvider = ({ children }: { children: ReactNode }) => {
  const [actions, setActions] = useState<Map<string, HeaderAction>>(new Map());
  const registry = useMemo<Registry>(
    () => ({
      actions: [...actions],
      set: (id, action) =>
        setActions((prev) => {
          const next = new Map(prev);
          if (action) next.set(id, action);
          else next.delete(id);
          return next;
        })
    }),
    [actions]
  );
  return (
    <FormHeaderContext.Provider value={registry}>
      {children}
    </FormHeaderContext.Provider>
  );
};

/** A modal form's title bar: stays at the top while the form scrolls, with every registered
 * Add button on the right. Assumes the usual p-6 scroll panel around the form. */
const FormHeader = ({ title }: { title: ReactNode }) => {
  const registry = useContext(FormHeaderContext);
  const actions = registry?.actions ?? [];
  if (!registry) return <h2 className="text-xl font-semibold">{title}</h2>;
  return (
    <div className="sticky -top-6 z-20 -mx-6 -mt-6 flex flex-wrap items-center gap-2 bg-white px-6 pb-3 pr-20 pt-6 dark:bg-gray-900">
      <h2 className="mr-auto text-xl font-semibold">{title}</h2>
      {actions.map(([id, action]) => (
        <Button
          key={id}
          size="sm"
          variant="outline"
          type="button"
          title={action.title}
          startIcon={<PlusIcon className="h-4 w-4" />}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default FormHeader;
