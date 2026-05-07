"use client";

import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import * as Yup from "yup";

import { TextInput } from "@/components/forms/system";
import { Screen } from "@/components/layout/Screen";
import { Button } from "@/components/ui/Button";
import { useCreateDesignMutation } from "@/store/jewellery-api";

interface DesignFormValues {
  name: string;
  code: string;
  default_weight: string;
  default_labour: string;
  default_stones: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  default_weight: Yup.string().matches(/^\d*\.?\d{0,4}$/, "Enter a valid weight (up to 4 decimal places)"),
});

const initialValues: DesignFormValues = {
  name: "",
  code: "",
  default_weight: "",
  default_labour: "",
  default_stones: "",
};

export default function NewDesignPage() {
  const router = useRouter();
  const [createDesign] = useCreateDesignMutation();

  const formik = useFormik<DesignFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: false,
    onSubmit: async (values, helpers) => {
      try {
        await createDesign({
          name: values.name.trim(),
          code: values.code.trim() || undefined,
          default_weight: values.default_weight.trim() || undefined,
          default_labour: values.default_labour.trim() || undefined,
          default_stones: values.default_stones.trim() || undefined,
        }).unwrap();
        router.push("/jewellery/master/designs");
      } finally {
        helpers.setSubmitting(false);
      }
    },
  });

  function fieldState(name: keyof DesignFormValues) {
    return {
      touched: Boolean(formik.touched[name]),
      error: typeof formik.errors[name] === "string" ? formik.errors[name] : undefined,
    };
  }

  return (
    <Screen
      title="Add design"
      subtitle="Create a new design in the library"
      backHref="/jewellery/master/designs"
    >
      <form onSubmit={formik.handleSubmit} className="space-y-4 max-w-lg" noValidate>
        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Design info</p>

          <TextInput
            label="Name"
            name="name"
            required
            placeholder="Design name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("name").touched}
            error={fieldState("name").error}
          />

          <TextInput
            label="Code"
            name="code"
            placeholder="Design code (optional)"
            value={formik.values.code}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("code").touched}
            error={fieldState("code").error}
          />
        </div>

        <div className="app-panel p-4 space-y-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">Defaults</p>

          <TextInput
            label="Default weight (g)"
            name="default_weight"
            placeholder="e.g. 5.2500"
            inputMode="decimal"
            value={formik.values.default_weight}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("default_weight").touched}
            error={fieldState("default_weight").error}
          />

          <TextInput
            label="Default labour"
            name="default_labour"
            placeholder="e.g. 500"
            inputMode="decimal"
            value={formik.values.default_labour}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("default_labour").touched}
            error={fieldState("default_labour").error}
          />

          <TextInput
            label="Default stones"
            name="default_stones"
            placeholder="Stone description or value"
            value={formik.values.default_stones}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            touched={fieldState("default_stones").touched}
            error={fieldState("default_stones").error}
          />
        </div>

        <div className="flex gap-3 pb-6">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={() => router.push("/jewellery/master/designs")}
          >
            Cancel
          </Button>
          <Button type="submit" fullWidth loading={formik.isSubmitting}>
            Add design
          </Button>
        </div>
      </form>
    </Screen>
  );
}
