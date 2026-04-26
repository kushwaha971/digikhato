import * as Yup from "yup";

export type LocationFormValues = {
  name: string;
  description?: string;
};

export const locationValidationSchema: Yup.ObjectSchema<LocationFormValues> = Yup.object({
  name: Yup.string().trim().min(2, "Name must be at least 2 characters").max(120, "Name must be at most 120 characters").required("Location name is required"),
  description: Yup.string().trim().max(500, "Description must be at most 500 characters").optional(),
});

export const locationInitialValues: LocationFormValues = {
  name: "",
  description: "",
};
